const resolvers = require('./resolvers');

async function test() {
  try {
    const user = await resolvers.Query.getUser(null, { id: '1' });
    console.log("GetUser result:", user);
  } catch (err) {
    console.error("Test Error:", err);
  }
}

test();
