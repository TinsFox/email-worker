import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
	if (!password) {
		throw new Error("Password is required");
	}
	return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
	return bcrypt.compare(password, hash);
}
