import { connectDB, disconnectDB } from './database';
import { User } from '../models/User';
import { Employee } from '../models/Employee';

const sampleEmployees = [
  {
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@company.com',
    position: 'CEO',
    department: 'Executive',
    salary: 150000,
    hireDate: new Date('2020-01-15'),
    managerId: null
  },
  {
    employeeId: 'EMP002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    position: 'CTO',
    department: 'Technology',
    salary: 120000,
    hireDate: new Date('2020-02-01'),
    managerId: null
  },
  {
    employeeId: 'EMP003',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@company.com',
    position: 'CFO',
    department: 'Finance',
    salary: 110000,
    hireDate: new Date('2020-03-01'),
    managerId: null
  },
  {
    employeeId: 'EMP004',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@company.com',
    position: 'Senior Developer',
    department: 'Technology',
    salary: 85000,
    hireDate: new Date('2021-01-15'),
    managerId: null // Will be updated after creation
  },
  {
    employeeId: 'EMP005',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@company.com',
    position: 'Junior Developer',
    department: 'Technology',
    salary: 65000,
    hireDate: new Date('2021-06-01'),
    managerId: null // Will be updated after creation
  },
  {
    employeeId: 'EMP006',
    firstName: 'Lisa',
    lastName: 'Anderson',
    email: 'lisa.anderson@company.com',
    position: 'HR Manager',
    department: 'Human Resources',
    salary: 75000,
    hireDate: new Date('2020-04-01'),
    managerId: null
  },
  {
    employeeId: 'EMP007',
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.taylor@company.com',
    position: 'Marketing Manager',
    department: 'Marketing',
    salary: 70000,
    hireDate: new Date('2020-05-01'),
    managerId: null
  }
];

const sampleUsers = [
  {
    email: 'admin@hierarchigraph.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  {
    email: 'user@hierarchigraph.com',
    password: 'user123',
    firstName: 'Regular',
    lastName: 'User',
    role: 'user'
  }
];

export const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Employee.deleteMany({});
    
    console.log('🗑️  Cleared existing data');
    
    // Create sample users
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`👥 Created ${createdUsers.length} users`);
    
    // Create sample employees
    const createdEmployees = await Employee.insertMany(sampleEmployees);
    console.log(`👨‍💼 Created ${createdEmployees.length} employees`);
    
    // Set up hierarchy relationships
    const ceo = createdEmployees.find(emp => emp.employeeId === 'EMP001');
    const cto = createdEmployees.find(emp => emp.employeeId === 'EMP002');
    const seniorDev = createdEmployees.find(emp => emp.employeeId === 'EMP004');
    const juniorDev = createdEmployees.find(emp => emp.employeeId === 'EMP005');
    
    if (ceo && cto && seniorDev && juniorDev) {
      // Set CTO under CEO
      await Employee.findByIdAndUpdate(cto._id, { managerId: ceo._id });
      await Employee.findByIdAndUpdate(ceo._id, { $push: { subordinates: cto._id } });
      
      // Set Senior Developer under CTO
      await Employee.findByIdAndUpdate(seniorDev._id, { managerId: cto._id });
      await Employee.findByIdAndUpdate(cto._id, { $push: { subordinates: seniorDev._id } });
      
      // Set Junior Developer under Senior Developer
      await Employee.findByIdAndUpdate(juniorDev._id, { managerId: seniorDev._id });
      await Employee.findByIdAndUpdate(seniorDev._id, { $push: { subordinates: juniorDev._id } });
      
      console.log('🏗️  Set up organizational hierarchy');
    }
    
    console.log('✅ Database initialization completed successfully!');
    console.log('\n📋 Sample Data Created:');
    console.log('👥 Users:');
    sampleUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    console.log('\n👨‍💼 Employees:');
    sampleEmployees.forEach(emp => {
      console.log(`   - ${emp.firstName} ${emp.lastName} (${emp.position} - ${emp.department})`);
    });
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@hierarchigraph.com / admin123');
    console.log('   User: user@hierarchigraph.com / user123');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}
