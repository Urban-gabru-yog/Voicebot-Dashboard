exports.matchByEmailOrPhone = (shopifyOrders, retellCalls) => {
  const matched = [];

  shopifyOrders.forEach((order) => {
    const email = order.email?.toLowerCase().trim();
    const phone = order.phone_number?.replace(/\D/g, "").slice(-10); // last 10 digits
    const orderCreatedAt = new Date(order.created_at);

    const match = retellCalls.find((call) => {
      const sameBrand = call.brand === order.brand;
      const callEmail = call.email?.toLowerCase().trim();
      const callPhone = call.to_number?.replace(/\D/g, "").slice(-10); // last 10 digits
      const callTime = new Date(call.start_timestamp);

      const emailMatch = callEmail === email;
      const phoneMatch = callPhone === phone;
      const timeValid = callTime <= orderCreatedAt;

      if (sameBrand && (emailMatch || phoneMatch) && timeValid) {
        console.log("✅ MATCH FOUND:", {
          brand: order.brand,
          shopifyEmail: email,
          shopifyPhone: phone,
          callEmail,
          callPhone,
          callTime,
          orderCreatedAt,
        });
        return true;
      }

      return false;
    });

    if (match) {
      matched.push({ shopify: order, retell: match });
    }
  });

  return matched;
};



// exports.matchByEmailOrPhone = (shopifyOrders, retellCalls) => {
//   const matched = [];

//   shopifyOrders.forEach(order => {
//     const email = order.email?.toLowerCase().trim();
//     const phone = order.phone_number?.replace(/\D/g, "").slice(-10); // last 10 digits

//     const match = retellCalls.find(call => {
//       const sameBrand = call.brand === order.brand;
//       const callEmail = call.email?.toLowerCase().trim();
//       const callPhone = call.to_number?.replace(/\D/g, "").slice(-10); // last 10 digits

//       const emailMatch = callEmail === email;
//       const phoneMatch = callPhone === phone;

//       if (sameBrand && (emailMatch || phoneMatch)) {
//         console.log("✅ MATCH FOUND:", {
//           brand: order.brand,
//           shopifyEmail: email,
//           shopifyPhone: phone,
//           callEmail,
//           callPhone
//         });
//         return true;
//       }

//       return false;
//     });

//     if (match) {
//       matched.push({ shopify: order, retell: match });
//     }
//   });

//   return matched;
// };
