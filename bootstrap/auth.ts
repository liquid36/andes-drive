import * as passport from 'passport';
import * as passportJWT from 'passport-jwt';
import * as jwt from 'jsonwebtoken';
import * as express from 'express';

const expiresIn = process.env.JWT_EXPIRES || 60 ; // 1 minute defualt

export const jwtKey = process.env.JWT_KEY || 'asdasd';

export function generateToken(uuid) {
    // Crea el token con los datos de sesión

    const token = {
        uuid,
        type: 'file-token'
    };

    return jwt.sign(token, jwtKey, { expiresIn });
}

export function initialize(app: express.Express) {
    // Configura passport para que utilice JWT
    passport.use(new passportJWT.Strategy(
        {
            secretOrKey: jwtKey,
            jwtFromRequest: passportJWT.ExtractJwt.fromExtractors([
                passportJWT.ExtractJwt.fromAuthHeaderWithScheme('jwt'),
                passportJWT.ExtractJwt.fromUrlQueryParameter('token')
            ])
        },
        (jwt_payload, done) => {
            done(null, jwt_payload);
        }
    ));

    // Inicializa passport
    app.use(passport.initialize());
}

export const Middleware = {
    authenticate() {
        return [
            passport.authenticate('jwt', { session: false })
        ];
    },

    optionalAuth() {
        return (req, res, next) => {
            try {
                let extractor = passportJWT.ExtractJwt.fromAuthHeaderWithScheme('jwt');
                let token = extractor(req);
                let tokenData = jwt.verify(token, jwtKey);
                if (tokenData) {
                    req.user = tokenData;
                }
                next();
            } catch (e) {
                next();
            }
        };
    }
};

