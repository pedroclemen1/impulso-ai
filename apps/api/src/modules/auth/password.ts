import bcrypt from 'bcryptjs';

const ROUNDS = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/** Hash fixo usado para equalizar o tempo de resposta quando o e-mail não existe. */
export const DUMMY_HASH = bcrypt.hashSync('impulso-timing-equalizer', ROUNDS);
