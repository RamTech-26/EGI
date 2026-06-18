package com.inventario.backendapi.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.filter.EqualsFilter;
import org.springframework.ldap.filter.AndFilter;
import org.springframework.ldap.core.AttributesMapper;
import org.springframework.stereotype.Service;
import javax.naming.NamingException;
import java.util.List;
import java.util.ArrayList;

@Service
public class LdapAuthService {

    @Autowired
    private LdapTemplate ldapTemplate;

    public boolean autenticar(String username, String password) {
        try {
            ldapTemplate.authenticate(
                    org.springframework.ldap.query.LdapQueryBuilder.query()
                            .where("cn").is(username),
                    password
            );
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public List<String> obtenerGrupos(String username) {
        String userDn = "cn=" + username + ",cn=Users,dc=itu,dc=local";

        AndFilter filter = new AndFilter();
        filter.and(new EqualsFilter("objectClass", "group"));
        filter.and(new EqualsFilter("member", userDn));

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
            if (grupo.equalsIgnoreCase("GRP_LECTOR")) {
                roles.add("LECTOR");
            } else if (grupo.equalsIgnoreCase("GRP_EDITOR")) {
                roles.add("EDITOR");
            } else if (grupo.equalsIgnoreCase("GRP_ADMINISTRADOR")) {
                roles.add("ADMINISTRADOR");
            }
        }
        return roles;
    }
}