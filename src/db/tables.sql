CREATE TABLE managers (
    id_manager SERIAL PRIMARY KEY,
    name_manager VARCHAR(40) NOT NULL,
    phone VARCHAR(10) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(60) NOT NULL
);

CREATE TABLE plans (
    id_plan SERIAL PRIMARY KEY,
    days_duration INT UNIQUE NOT NULL,
    price INT UNIQUE NOT NULL
);

CREATE TABLE payment_methods (
    id_method SERIAL PRIMARY KEY,
    name_method varchar(13) UNIQUE NOT NULL
);

CREATE TABLE states (
    id_state SERIAL PRIMARY KEY,
    name_state VARCHAR(10) UNIQUE NOT NULL
);

CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    name_user VARCHAR(40) NOT NULL,
    phone VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE memberships (
    id_membership SERIAL PRIMARY KEY,
    last_payment DATE NOT NULL,
    expiration_date DATE NOT NULL,
    receipt_number varchar(6) UNIQUE NOT NULL,
    days_arrears INT DEFAULT 0,
    id_manager INTEGER NOT NULL REFERENCES managers(id_manager)
        ON DELETE RESTRICT  
        ON UPDATE CASCADE,
    id_user INTEGER NOT NULL REFERENCES users(id_user)
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    id_plan INTEGER NOT NULL REFERENCES plans(id_plan)
        ON DELETE RESTRICT  
        ON UPDATE CASCADE,
    id_method INTEGER NOT NULL REFERENCES payment_methods(id_method)
        ON DELETE RESTRICT  
        ON UPDATE CASCADE,
    id_state INTEGER NOT NULL REFERENCES states(id_state)
        ON DELETE RESTRICT   
        ON UPDATE CASCADE 
);
