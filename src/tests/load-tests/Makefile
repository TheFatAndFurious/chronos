# load-tests/Makefile
.PHONY: up down test-read test-write test-saga test-all clean

COMPOSE = docker compose -f docker-compose.load-testing.yml

up:
	$(COMPOSE) up -d --build
	@sleep 5  # laisse le temps à l'app de démarrer

down:
	$(COMPOSE) down -v

test-read:
	$(COMPOSE) run --rm -e BASE_URL=http://chronos:3000 k6 run /scripts/01-read-heavy.js

test-write:
	$(COMPOSE) run --rm -e BASE_URL=http://chronos:3000 k6 run /scripts/02-write-concurrent.js

test-saga:
	$(COMPOSE) run --rm -e BASE_URL=http://chronos:3000 k6 run /scripts/03-saga-transfer.js

test-all: up
	@$(MAKE) test-read

clean: down
	rm -rf results/