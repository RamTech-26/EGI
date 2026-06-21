package com.inventario.backendapi.auth;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class LdapConfig {

    // svc_backend (lectura)
    @Value("${spring.ldap.urls}")
    private String url;

    @Value("${spring.ldap.base}")
    private String base;

    @Value("${spring.ldap.username}")
    private String username;

    @Value("${spring.ldap.password}")
    private String password;

    // svc_admin (escritura)
    @Value("${spring.ldap-admin.urls}")
    private String adminUrl;

    @Value("${spring.ldap-admin.base}")
    private String adminBase;

    @Value("${spring.ldap-admin.username}")
    private String adminUsername;

    @Value("${spring.ldap-admin.password}")
    private String adminPassword;

    @Bean
    public LdapContextSource contextSource() {
        LdapContextSource contextSource = new LdapContextSource();
        contextSource.setUrl(url);
        contextSource.setBase(base);
        contextSource.setUserDn(username);
        contextSource.setPassword(password);

        Map<String, Object> envProps = new HashMap<>();
        envProps.put("java.naming.referral", "follow");
        contextSource.setBaseEnvironmentProperties(envProps);
        contextSource.afterPropertiesSet();
        return contextSource;
    }

    @Bean
    public LdapTemplate ldapTemplate() {
        LdapTemplate template = new LdapTemplate(contextSource());
        template.setIgnorePartialResultException(true);
        return template;
    }

    @Bean
    public LdapContextSource contextSourceAdmin() {
        LdapContextSource contextSource = new LdapContextSource();
        contextSource.setUrl(adminUrl);
        contextSource.setBase(""); //DNs absolutos para operaciones de escritura
        contextSource.setUserDn(adminUsername);
        contextSource.setPassword(adminPassword);

        Map<String, Object> envProps = new HashMap<>();
        envProps.put("java.naming.referral", "follow");
        contextSource.setBaseEnvironmentProperties(envProps);
        contextSource.afterPropertiesSet();
        return contextSource;
    }

    @Bean
    @Qualifier("ldapTemplateAdmin")
    public LdapTemplate ldapTemplateAdmin() {
        LdapTemplate template = new LdapTemplate(contextSourceAdmin());
        template.setIgnorePartialResultException(true);
        return template;
    }
}