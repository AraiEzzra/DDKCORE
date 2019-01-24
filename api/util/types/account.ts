export type AddressParams = {
    address: string;
};

export type SecretParams = {
    secret: string;
}

export type RegistrationParams = {
    secret: string;
    email?: string;
}

export type GetAccountParams = {
    address: string;
    publicKey: string;
}

