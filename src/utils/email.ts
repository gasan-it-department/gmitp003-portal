export const mainGun = async () => {
  const response = await fetch(
    `https://api.mailgun.net/v3/sandbox91b12871d2474279b1632cececc7055d.mailgun.org/messages`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          btoa("api:8aebc4653a2868814895387ee8d41595-8a3819a9-08ff04df"),
      },
    },
  );

  return response;
};
