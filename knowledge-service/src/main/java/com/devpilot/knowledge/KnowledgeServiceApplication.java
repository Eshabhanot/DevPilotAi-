package com.devpilot.knowledge;

import org.springframework.ai.vectorstore.pgvector.autoconfigure.PgVectorStoreAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication(exclude = {PgVectorStoreAutoConfiguration.class})
@EnableDiscoveryClient
public class KnowledgeServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(KnowledgeServiceApplication.class, args);
	}

}
