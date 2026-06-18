package com.inventario.backendapi.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.util.Properties;

@Configuration
@Profile("kerberos")
public class KerberosDataSourceConfig {

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${java.security.krb5.conf}")
    private String krb5ConfPath;

    @Value("${java.security.auth.login.config}")
    private String loginConfPath;

    @Bean
    public DataSource dataSource() {
        // Configurar Kerberos para la JVM
        System.setProperty("java.security.krb5.conf", krb5ConfPath);
        System.setProperty("java.security.auth.login.config", loginConfPath);
        System.setProperty("javax.security.auth.useSubjectCredsOnly", "false");

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setDriverClassName("com.microsoft.sqlserver.jdbc.SQLServerDriver");

        Properties props = new Properties();
        props.setProperty("integratedSecurity", "true");
        props.setProperty("authenticationScheme", "JavaKerberos");
        // TODO: Ajustar SPN y host del SQL Server según datos de P2
        props.setProperty("serverSpn", "MSSQLSvc/10.10.10.20:1433");
        config.setDataSourceProperties(props);

        return new HikariDataSource(config);
    }
}