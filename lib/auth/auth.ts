import jwt from 'jsonwebtoken';

const verify = async (token: string) => {
    let userId;

    const payload = jwt.verify(token, process.env.JWT_PUBLIC_KEY!, { algorithms: ['RS256'] });

    if (typeof payload !== 'string' && 'userId' in payload) {
        userId = payload.userId;
    } else {
        userId = null;
    }
    return userId;
}

export { verify };