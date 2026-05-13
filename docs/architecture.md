# GhanaCarSpecs Architecture

## Current Architecture

The current MVP uses a simple local-first architecture.

## Application Structure

The app should be built as a Next.js application.

Recommended structure:

```text

ghanacarspecs/

├── app/

│   ├── page.tsx

│   ├── api/

│   │   └── v1/

│   │       └── lookup/

│   │           └── route.ts

│   └── vehicles/

│       └── [id]/

│           └── page.tsx

│

├── components/

│   ├── LookupForm.tsx

│   ├── VehicleReport.tsx

│   └── EventTimeline.tsx

│

├── lib/

│   ├── prisma.ts

│   └── lookup.ts

│

├── prisma/

│   ├── schema.prisma

│   └── seed.ts

│

├── docs/

│   ├── product_[vision.md](http://vision.md)

│   ├── [project.md](http://project.md)

│   ├── [architecture.md](http://architecture.md)

│   └── [roadmap.md](http://roadmap.md)

│

├── [README.md](http://README.md)

└── package.json