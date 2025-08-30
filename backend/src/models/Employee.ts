import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IEmployee extends Document {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  hireDate: Date;
  salary: number;
  managerId?: mongoose.Types.ObjectId;
  subordinates: mongoose.Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  getGravatarUrl(size?: number): string;
  getFullName(): string;
}

const employeeSchema = new Schema<IEmployee>({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  hireDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  salary: {
    type: Number,
    required: true,
    min: 0
  },
  managerId: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  subordinates: [{
    type: Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
employeeSchema.index({ managerId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ isActive: 1 });

// Generate Gravatar URL
employeeSchema.methods.getGravatarUrl = function(size: number = 200): string {
  const hash = crypto.createHash('md5').update(this.email.toLowerCase().trim()).digest('hex');
  const defaultAvatar = process.env.GRAVATAR_DEFAULT || 'identicon';
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultAvatar}`;
};

// Get full name
employeeSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return this.getFullName();
});

// Ensure virtual fields are serialized
employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
