const collision = 100000;

export const getRequestHeader = () => {
    return {
        id: Math.floor(Math.random() * collision),
        type: 1
    };
};
