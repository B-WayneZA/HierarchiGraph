import { connectDB, getDriver, disconnectDB } from './database';

const initDb = async () => {
  console.log('Connecting to database to initialize constraints...');
  await connectDB();
  const driver = getDriver();
  const session = driver.session();

  try {
    console.log('Applying constraints...');

    // User constraints
    await session.run('CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE');
    console.log('  - User email uniqueness constraint applied.');

    // Employee constraints
    await session.run('CREATE CONSTRAINT employee_id_unique IF NOT EXISTS FOR (e:Employee) REQUIRE e.employeeId IS UNIQUE');
    console.log('  - Employee ID uniqueness constraint applied.');
    await session.run('CREATE CONSTRAINT employee_email_unique IF NOT EXISTS FOR (e:Employee) REQUIRE e.email IS UNIQUE');
    console.log('  - Employee email uniqueness constraint applied.');

    console.log('✅ Database initialization complete.');
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
  } finally {
    await session.close();
    await disconnectDB();
  }
};

initDb();
