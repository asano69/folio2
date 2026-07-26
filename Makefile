include folio2.env
export

BINARY := $(notdir $(CURDIR))
APP := $(notdir $(CURDIR))
# Ports used by the dev servers (frontend, backend, and PocketBase-style API)
PORTS := 3000 3001


.PHONY: all
all: kill-ports frontend## (*) Build frontend assets and start the server
	go run ./cmd/$(BINARY) superuser upsert admin@mail.internal password --dir=pb_data
	go run ./cmd/$(BINARY) serve

.PHONY: frontend
frontend: frontend/node_modules
	cd frontend && pnpm run build

frontend/node_modules: frontend/package.json frontend/pnpm-lock.yaml
	cd frontend && pnpm install --frozen-lockfile
	touch $@


.PHONY: build
build: frontend
	go build -o $(BINARY) ./cmd/$(BINARY)

.PHONY: kill-ports
kill-ports:
	@for port in $(PORTS); do \
		pid=$$(lsof -ti tcp:$$port); \
		if [ -n "$$pid" ]; then \
			echo "Killing process on port $$port (pid $$pid)"; \
			kill -9 $$pid; \
		fi \
	done


.PHONY: server
server: kill-ports
	#./folio2 migrate up --dir=pb_data
	./$(BINARY) superuser upsert admin@mail.internal password --dir=pb_data
	./$(BINARY) serve

# --------------
.PHONY: clean
	rm -fr ./tmp/ # air

# port: 3001
.PHONY: dev-front
dev-front: clean
	npx concurrently -n "frontend,backend" -c "blue,green" "cd frontend && pnpm dev" "./$(BINARY) serve"

# port: 3000
.PHONY: dev-back
dev-back: clean
	npx concurrently -n "frontend,backend" -c "blue,green" "cd frontend && pnpm watch" "air"


.PHONY: test
test:
	cd frontend && pnpm test
	go test ./...


format:
	cd frontend && pnpm exec prettier --write "src/**/*.{js,jsx,css}"

# 本番では、後方互換性のために残しておいたほうが良いかも。
migrate-collections:
	ls -1 migrations/*.go | sort | head -n -1 | xargs rm -f
	yes | go run ./cmd/folio2 migrate collections
	ls -1 migrations/*.go | sort | head -n -1 | xargs rm -f
