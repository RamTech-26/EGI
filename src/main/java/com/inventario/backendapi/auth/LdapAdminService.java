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

        List<String> todosLosGrupos = List.of(
                "CN=GRP_LECTOR,OU=Grupos,OU=EGI,DC=itu,DC=local",
                "CN=GRP_EDITOR,OU=Grupos,OU=EGI,DC=itu,DC=local",
                "CN=GRP_ADMINISTRADOR,OU=Grupos,OU=EGI,DC=itu,DC=local"
        );

        for (String groupDnStr : todosLosGrupos) {
            try {
                javax.naming.ldap.LdapName groupDn = new javax.naming.ldap.LdapName(groupDnStr);
                org.springframework.ldap.core.DirContextOperations ctx =
                        ldapTemplateAdmin.lookupContext(groupDn);
                ctx.removeAttributeValue("member", userDn.toString());
                ldapTemplateAdmin.modifyAttributes(ctx);
            } catch (Exception e) {
                // Si no era miembro o no existe, ignoramos
            }
        }

        org.springframework.ldap.core.DirContextOperations ctx =
                ldapTemplateAdmin.lookupContext(newGroupDn);
        ctx.addAttributeValue("member", userDn.toString());
        ldapTemplateAdmin.modifyAttributes(ctx);
    }
}