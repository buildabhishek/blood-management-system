# Blood Management System

A role-based blood management platform with Hospital, Blood Bank, Rider, and Admin workflows.

## Production readiness

- Backend credentials, secrets, and Firebase config are now injected from environment variables.
- Frontend API calls default to `/api` so the app works from the same origin in production.
- Frontend assets are automatically built and included in the Spring Boot jar during Maven packaging.
- Sensitive files such as `backend/firebase-service-account.json` and build artifacts are ignored by Git.

## Backend configuration

Copy the example and configure secure values before deployment:

```bash
cd backend
cp src/main/resources/application-example.properties src/main/resources/application.properties
```

Set these environment variables in production:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`
- `GOOGLE_MAPS_API_KEY`
- `FIREBASE_CREDENTIALS_PATH`
- `FIREBASE_PROJECT_ID`
- `SPRING_JPA_HIBERNATE_DDL_AUTO` (optional)

### Run backend locally

```bash
cd backend
mvn spring-boot:run
```

## Frontend configuration

Use `.env.example` as a template:

```bash
cd frontend
cp .env.example .env
```

Set `REACT_APP_API_URL` to `/api` for same-origin production, or to the backend URL if you deploy frontend separately.

### Run frontend locally

```bash
cd frontend
npm install
npm start
```

## Build for production

From the backend folder, build the full application jar:

```bash
cd backend
mvn clean package
```

Then run the jar:

```bash
java -jar target/blood-management-system-1.0.0.jar
```

The React frontend is served from `src/main/resources/static` in the packaged jar.

## Notes

- `backend/firebase-service-account.json` is ignored by Git for safety.
- In production, supply a strong `JWT_SECRET` and avoid default placeholder values.
- If your app is deployed behind a reverse proxy, configure `APP_CORS_ALLOWED_ORIGINS` accordingly.
