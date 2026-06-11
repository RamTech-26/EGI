package com.inventario.backendapi.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.ldap.filter.AndFilter;
import org.springframework.ldap.core.AttributesMapper;
import org.springframework.stereotype.Service;
import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import java.util.List;
import java.util.ArrayList;

@Service
public class LdapAuthService {

    @Autowired
    private LdapTemplate ldapTemplate;

    public boolean autenticar(String username, String password) {
        try {
            LdapContextSource contextSource = (LdapContextSource) ldapTemplate.getContextSource();
            contextSource.getContext(
                    "cn=" + username + ",cn=Users,dc=itu,dc=local",
                    password
            );
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public List<String> obtenerGrupos(String username) {
        AndFilter filter = new AndFilter();
        filter.and(new EqualsFilter("objectclass", "group"));
        filter.and(new EqualsFilter("member", "cn=" + username + ",cn=Users,dc=itu,dc=local"));

        return ldapTemplate.search(
                "dc=itu,dc=local",
                filter.encode(),
                (AttributesMapper<String>) attrs -> {
                    try {
                        return attrs.get("cn").get().toString();
                    } catch (NamingException e) {
                        return "";
                    }
                }
        );
    }

    public List<String> convertirGruposARoles(List<String> gruposAD) {
        List<String> roles = new ArrayList<>();
        for (String grupo : gruposAD) {
            if (grupo.equalsIgnoreCase("Profesores")) {
                roles.add("LECTOR");
            } else if (grupo.equalsIgnoreCase("Responsables")) {
                roles.add("EDITOR");
            } else if (grupo.equalsIgnoreCase("Administradores")) {
                roles.add("ADMINISTRADOR");
            }
        }
        return roles;
    }
}