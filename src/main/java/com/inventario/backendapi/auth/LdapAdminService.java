package com.inventario.backendapi.auth;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.stereotype.Service;

@Service
public class LdapAdminService {

    private final LdapTemplate ldapTemplateAdmin;

    public LdapAdminService(@Qualifier("ldapTemplateAdmin") LdapTemplate ldapTemplateAdmin) {
        this.ldapTemplateAdmin = ldapTemplateAdmin;
    }

    public void agregarUsuarioAGrupo(String username, String grupoCN) {
        String userDn = "CN=" + username + ",OU=Usuarios,OU=EGI,DC=itu,DC=local";
        String groupDn = "CN=" + grupoCN + ",OU=Usuarios,OU=EGI,DC=itu,DC=local";

        org.springframework.ldap.core.DirContextOperations ctx =
                ldapTemplateAdmin.lookupContext(groupDn);
        ctx.addAttributeValue("member", userDn);
        ldapTemplateAdmin.modifyAttributes(ctx);
    }
}
