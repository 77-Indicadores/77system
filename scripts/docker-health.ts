const services = [
  process.env.APP_HEALTH_URL ?? "http://localhost:3001/api/health",
  process.env.CATWORLD_HEALTH_URL ?? "http://localhost:8001/health"
];

for (const url of services) {
  const response = await fetch(url).catch(() => null);
  if (!response?.ok) {
    console.error(`Health check falhou: ${url}`);
    process.exit(1);
  }
}

console.log("docker:health ok");

export {};
