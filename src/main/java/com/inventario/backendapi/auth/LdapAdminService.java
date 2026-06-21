package com.inventario.backendapi.auth;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class LdapAdminService {

    private final LdapTemplate ldapTemplateAdmin;

    public LdapAdminService(@Qualifier("ldapTemplateAdmin") LdapTemplate ldapTemplateAdmin) {
        this.ldapTemplateAdmin = ldapTemplateAdmin;
    }

    public void cambiarGrupoUsuario(String username, String grupoCN) {
        javax.naming.ldap.LdapName userDn;
        javax.naming.ldap.LdapName newGroupDn;

        try {
            userDn = new javax.naming.ldap.LdapName("CN=" + username + ",OU=Usuarios,OU=EGI,DC=itu,DC=local");
            newGroupDn = new javax.naming.ldap.LdapName("CN=" + grupoCN + ",OU=Grupos,OU=EGI,DC=itu,DC=local");
        } catch (javax.naming.InvalidNameException e) {
            throw new RuntimeException("DN inválido", e);
        }

        System.out.println("userDn.toString(): " + userDn.toString());
        System.out.println("newGroupDn.toString(): " + newGroupDn.toString());

        List<String> todosLosGrupos = List.of(
                "CN=GRP_LECTOR,OU=Grupos,OU=EGI,DC=itu,DC=local",
                "CN=GRP_EDITOR,OU=Grupos,OU=EGI,DC=itu,DC=local",
                "CN=GRP_ADMINISTRADOR,OU=Grupos,OU=EGI,DC=itu,DC=local"
        );

        for (String groupDnStr : todosLosGrupos) {
            try {
                javax.naming.ldap.LdapName groupDn = new javax.naming.ldap.LdapName(groupDnStr);
                System.out.println("Intentando quitar de grupo: " + groupDnStr);
                org.springframework.ldap.core.DirContextOperations ctx =
                        ldapTemplateAdmin.lookupContext(groupDn);
                ctx.removeAttributeValue("member", userDn.toString());
                ldapTemplateAdmin.modifyAttributes(ctx);
                System.out.println("Quitado de: " + groupDnStr);
            } catch (Exception e) {
                System.out.println("No estaba en grupo o error: " + groupDnStr + " - " + e.getMessage());
            }
        }

        System.out.println("Agregando a nuevo grupo: " + newGroupDn.toString());
        org.springframework.ldap.core.DirContextOperations ctx =
                ldapTemplateAdmin.lookupContext(newGroupDn);
        ctx.addAttributeValue("member", userDn.toString());
        ldapTemplateAdmin.modifyAttributes(ctx);
        System.out.println("Agregado correctamente a: " + grupoCN);
    }
}