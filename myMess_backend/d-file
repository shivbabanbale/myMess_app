FROM openjdk
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} myMess.jar
ENTRYPOINT ["java", "-jar", "/myMess.jar"]
