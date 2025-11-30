# Ligao Smart Cemetery Management System


## Pagsisimula

Sundin ang mga instruksyon na ito upang mai-set up at mapatakbo ang proyekto sa iyong lokal na makina.

### Mga Kinakailangan

- [Node.js](https://nodejs.org/) (version 18 o mas mataas)
- [Docker](https://www.docker.com/) (kailangan para sa lokal na database)
- [pnpm](https://pnpm.io/) (inirerekomenda) o npm/bun
- [Git](https://git-scm.com/)

### Pag-install

1. **I-clone ang repository:**
   ```bash
   git clone https://github.com/BSIT-Evanism/ligaocemv3.git
   cd ligaocemv3
   ```

2. **I-install ang mga dependencies:**
   ```bash
   pnpm install
   # o
   npm install
   ```

### Konfigurasyon

1. **Mga Environment Variable:**
   Kopyahin ang halimbawang environment file upang malikha ang iyong lokal na `.env` file:
   ```bash
   cp .env.example .env
   ```
   
   Buksan ang `.env` at siguraduhing tama ang `DATABASE_URL`. Ang default na konfigurasyon ay naka-set up upang gumana sa ibinigay na database script.

### Pag-set up ng Database

1. **Simulan ang Database:**
   Ang proyektong ito ay may kasamang script upang magpatakbo ng PostgreSQL container gamit ang Docker.
   ```bash
   ./start-database.sh
   ```
   *Paalala: Siguraduhing tumatakbo ang Docker Desktop (o katumbas nito).*

2. **I-push ang Schema:**
   I-apply ang database schema gamit ang Drizzle Kit:
   ```bash
   pnpm db:push
   # o
   npm run db:push
   ```

### Pagpapatakbo ng Aplikasyon

Simulan ang development server:
```bash
pnpm dev
# o
npm run dev
```

Buksan ang [http://localhost:3000](http://localhost:3000) gamit ang iyong browser upang makita ang resulta.

### Mga Teknolohiyang Ginamit

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Drizzle ORM](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

