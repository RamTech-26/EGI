# Etapa 1: Construcción
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN apk add --no-cache maven && mvn clean package -DskipTests

# Etapa 2: Ejecución
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiar archivos de Kerberos (keytab, krb5.conf, login.conf)
# TODO: Ajustar rutas cuando P2 entregue el keytab
COPY --from=builder /app/target/*.jar app.jar
COPY src/main/resources/krb5.conf /etc/krb5.conf
COPY src/main/resources/login.conf /etc/login.conf
# COPY ruta/al/keytab /etc/krb5.keytab

# Variables de entorno para Kerberos
ENV JAVA_OPTS="-Djava.security.krb5.conf=/etc/krb5.conf -Djava.security.auth.login.config=/etc/login.conf"

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]