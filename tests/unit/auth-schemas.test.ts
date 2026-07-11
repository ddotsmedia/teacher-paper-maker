import { describe, expect, it } from 'vitest';
import {
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  TeacherProfileSchema,
  passwordSchema,
} from '@tpm/schemas';

describe('passwordSchema', () => {
  it('accepts a strong password', () => {
    expect(passwordSchema.safeParse('Password1').success).toBe(true);
  });

  it.each([
    ['too short', 'Pass1'],
    ['no uppercase', 'password1'],
    ['no number', 'Password'],
  ])('rejects %s', (_label, value) => {
    expect(passwordSchema.safeParse(value).success).toBe(false);
  });
});

describe('RegisterSchema', () => {
  it('normalizes email to lowercase and trims name', () => {
    const parsed = RegisterSchema.parse({
      email: 'Teacher@Example.COM',
      name: '  Ada Lovelace  ',
      password: 'Password1',
    });
    expect(parsed.email).toBe('teacher@example.com');
    expect(parsed.name).toBe('Ada Lovelace');
  });

  it('rejects invalid email', () => {
    const result = RegisterSchema.safeParse({
      email: 'not-an-email',
      name: 'Ada',
      password: 'Password1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects short names', () => {
    const result = RegisterSchema.safeParse({
      email: 'a@b.com',
      name: 'A',
      password: 'Password1',
    });
    expect(result.success).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('requires a non-empty password', () => {
    expect(LoginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
    expect(LoginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
});

describe('ResetPasswordSchema', () => {
  it('enforces the password policy', () => {
    expect(ResetPasswordSchema.safeParse({ password: 'weak' }).success).toBe(false);
    expect(ResetPasswordSchema.safeParse({ password: 'Strong123' }).success).toBe(true);
  });
});

describe('TeacherProfileSchema', () => {
  it('accepts allowed curriculum, grades, and subjects', () => {
    const result = TeacherProfileSchema.safeParse({
      schoolName: 'Springfield',
      preferredCurriculum: 'CBSE',
      preferredGrades: ['1', '2', '12'],
      preferredSubjects: ['English', 'Mathematics'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown curriculum', () => {
    const result = TeacherProfileSchema.safeParse({ preferredCurriculum: 'UNKNOWN' });
    expect(result.success).toBe(false);
  });

  it('rejects an out-of-range grade', () => {
    const result = TeacherProfileSchema.safeParse({ preferredGrades: ['13'] });
    expect(result.success).toBe(false);
  });
});
