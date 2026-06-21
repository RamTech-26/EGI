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
        String userDn = "CN=" + username + ",CN=Users,DC=itu,DC=local";

        List<String> todosLosGrupos = List.of(
                "CN=GRP_LECTOR,CN=Users,DC=itu,DC=local",
                "CN=GRP_EDITOR,CN=Users,DC=itu,DC=local",
                "CN=GRP_ADMINISTRADOR,CN=Users,DC=itu,DC=local"
        );

        for (String groupDn : todosLosGrupos) {
            try {
                org.springframework.ldap.core.DirContextOperations ctx =
                        ldapTemplateAdmin.lookupContext(groupDn);
                ctx.removeAttributeValue("member", userDn);
                ldapTemplateAdmin.modifyAttributes(ctx);
            } catch (Exception e) {
                // Si no era miembro, ignoramos
            }
        }

        String newGroupDn = "CN=" + grupoCN + ",CN=Users,DC=itu,DC=local";
        org.springframework.ldap.core.DirContextOperations ctx =
                ldapTemplateAdmin.lookupContext(newGroupDn);
        ctx.addAttributeValue("member", userDn);
        ldapTemplateAdmin.modifyAttributes(ctx);
    }
}