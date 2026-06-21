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
            System.out.println("LDAP AUTH OK para: " + username);
            return true;
        } catch (Exception e) {
            System.out.println("LDAP AUTH FALLO para: " + username);
            System.out.println("Tipo de excepción: " + e.getClass().getName());
            System.out.println("Mensaje: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public List<String> obtenerGrupos(String username) {
        String userDn = "CN=" + username + ",OU=Usuarios,OU=EGI,DC=itu,DC=local";

        AndFilter filter = new AndFilter();
        filter.and(new EqualsFilter("objectClass", "group"));
        filter.and(new EqualsFilter("member", userDn));

        return ldapTemplate.search(
                "",
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

    public List<String> obtenerUsuariosDeGrupo(String grupoCN) {
        String groupDn = "CN=" + grupoCN + ",OU=Grupos,OU=EGI,DC=itu,DC=local";

        AndFilter filter = new AndFilter();
        filter.and(new EqualsFilter("objectClass", "group"));
        filter.and(new EqualsFilter("cn", grupoCN));

        List<String> miembros = ldapTemplate.search(
                "",
                filter.encode(),
                (AttributesMapper<List<String>>) attrs -> {
                    List<String> users = new ArrayList<>();
                    try {
                        javax.naming.NamingEnumeration<?> members = attrs.get("member").getAll();
                        while (members.hasMore()) {
                            String dn = members.next().toString();
                            // Extraer el CN del DN: CN=usr.lector,OU=...
                            String cn = dn.split(",")[0].replace("CN=", "").replace("cn=", "");
                            users.add(cn);
                        }
                    } catch (Exception e) {
                        // grupo sin miembros
                    }
                    return users;
                }
        ).stream().findFirst().orElse(new ArrayList<>());

        return miembros;
    }

    public List<java.util.Map<String, String>> obtenerUsuariosConRol() {
        List<String> grupos = List.of("GRP_LECTOR", "GRP_EDITOR", "GRP_ADMINISTRADOR");
        List<java.util.Map<String, String>> resultado = new ArrayList<>();

        for (String grupo : grupos) {
            String rol = convertirGruposARoles(List.of(grupo)).stream().findFirst().orElse("");
            for (String usuario : obtenerUsuariosDeGrupo(grupo)) {
                java.util.Map<String, String> entry = new java.util.HashMap<>();
                entry.put("username", usuario);
                entry.put("rol", rol);
                entry.put("grupo", grupo);
                resultado.add(entry);
            }
        }
        return resultado;
    }
}