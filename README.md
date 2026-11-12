# Doctor appointment booking

A booking system for a small GP practice. Patients pick a free slot and get a confirmation email; staff manage appointments and opening hours from an admin area.

**Stack:** Next.js 16 (App Router), Tailwind CSS, shadcn/ui, Drizzle ORM, Postgres (Neon), Resend.

## Features

- Patients choose a date and time from live availability and book in under a minute
- Confirmation, reschedule and cancellation emails to both patient and doctor
- Patients reschedule or cancel from a private link in their email, no account needed
- Admin area: upcoming appointments, cancel, reschedule
- Admin sets weekly opening hours, appointment length and days off
- Double-booking is prevented by a partial unique index in the database, not just in the UI
- Timezone-safe: slots are generated in the clinic's timezone, including across daylight-saving changes

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. No accounts are needed:

- **Database:** without `DATABASE_URL` the app uses PGlite (Postgres running in-process), creates the tables and adds default opening hours on first use.
- **Email:** without `RESEND_API_KEY` emails are printed to the terminal running `npm run dev`.
- **Admin:** go to `/admin` and sign in with the password `admin` (development only).

Optional sample data (stop the dev server first): `npm run db:seed`

## Going live

Copy `.env.example` to `.env.local` (or set the variables on your host):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string. Run `npm run db:migrate` once. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Send real email through Resend |
| `DOCTOR_EMAIL` | Where booking notifications go |
| `ADMIN_PASSWORD`, `SESSION_SECRET` | Required in production |
| `CLINIC_TIMEZONE` | IANA timezone, e.g. `Europe/London` |
| `NEXT_PUBLIC_APP_URL` | Public URL, used for links in emails |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm test` | Unit tests for slot generation |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to the `DATABASE_URL` database |
| `npm run db:seed` | Add sample appointments |

## Where things are

- `src/lib/slots.ts`: pure slot-generation logic (unit tested)
- `src/lib/appointments.ts`: booking, rescheduling, cancelling and notifications
- `src/app/actions.ts`: Server Actions for the patient and admin forms
- `src/db/schema.ts`: tables and the double-booking index
- `src/emails/`: email template

This is a demo. It is not a compliant medical-records system; do not store real patient information in it.
