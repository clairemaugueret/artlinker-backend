const stripe = require("stripe")(
  "sk_test_51RTf2aCRuiuQazlKsbJbFD3N6AXvhFOb4nPU9GDpw8a8qLSBSLM0YQmaYRZxk1vkRO5OFNrLWXBLNIZPPX1dms6D00Dz8lxTyQ"
);

stripe.products
  .create({
    name: "Starter",
    description: "100/Year subscription",
  })
  .then((product) => {
    stripe.prices
      .create({
        unit_amount: 100,
        currency: "EUR",
        recurring: {
          interval: "year",
        },
        product: product.id,
      })
      .then((price) => {
        console.log(
          "Success! Here is your starter subscription product id: " + product.id
        );
        console.log(
          "Success! Here is your starter subscription price id: " + price.id
        );
      });
  });
