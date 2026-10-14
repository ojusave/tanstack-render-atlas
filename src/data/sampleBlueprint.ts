// This fixture mirrors the checked-in render.yaml so the Blueprint screen can
// show the deployment contract without needing a Render account or API call.
export const sampleBlueprint = `services:
  - type: web
    name: tanstack-render-atlas
    runtime: node
    plan: 1c-2g
    region: oregon
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: tanstack-render-atlas-db
          property: connectionString
      - key: NODE_ENV
        value: production

databases:
  - name: tanstack-render-atlas-db
    plan: basic-256mb
    region: oregon
    databaseName: render_atlas
    user: render_atlas
`;
