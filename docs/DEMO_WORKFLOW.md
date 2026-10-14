# Judge demonstration workflow

Seeded data is enough. No external AI keys.

1. Open the landing page. State that this is an independent SIH25033 prototype.
2. Log in as `aarav@example.com` / `Student@12345`. Show profile, skills, ranked internships.
3. Open Discover internships. Open Cybersecurity Analyst Intern. Show eligibility conditions and factor scores.
4. Log out. Log in as `admin@example.com` / `Admin@12345`.
5. Admin dashboard: live counts. Matching config: weights sum to 100.
6. Allocation control: Run Smart Allocation. Wait for the API; then publish.
7. Results: allocated, waitlisted, unallocated. Open Explain.
8. Waitlist: reject one allocated offer and confirm the next waitlisted student is offered the seat.
9. Simulation: increase seats on one internship, run simulation, confirm published results unchanged.
