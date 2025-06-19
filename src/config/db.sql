CREATE TABLE managers (
    id_manager SERIAL PRIMARY KEY,
    name_manager VARCHAR(40) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    email VARCHAR(50) NOT NULL,
    password VARCHAR(60) NOT NULL
);

CREATE TABLE plans (
    id_plan SERIAL PRIMARY KEY,
    days_duration INT NOT NULL,
    price INT NOT NULL
);

CREATE TABLE payment_methods (
    id_method SERIAL PRIMARY KEY,
    name_method varchar(13) NOT NULL
);

CREATE TABLE estates (
    id_estate SERIAL PRIMARY KEY,
    name_estate VARCHAR(10) NOT NULL
);

CREATE TABLE users (
    id_user SERIAL PRIMARY KEY,
    name_user VARCHAR(40) NOT NULL,
    phone VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_manager INTEGER NOT NULL REFERENCES managers(id_manager)
        ON DELETE RESTRICT  
        ON UPDATE CASCADE
);

CREATE TABLE memberships (
    id_membership SERIAL PRIMARY KEY,
    last_payment DATE NOT NULL,
    expiration_date DATE NOT NULL,
    receipt_number varchar(6) UNIQUE NOT NULL,
    days_arrears INT DEFAULT 0,
    id_user INTEGER NOT NULL REFERENCES users(id_user)
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    id_plan INTEGER NOT NULL REFERENCES plans(id_plan)
        ON DELETE RESTRICT  
        ON UPDATE CASCADE,
    id_method INTEGER NOT NULL REFERENCES payment_methods(id_method)
        ON DELETE RESTRICT  
        ON UPDATE CASCADE,
    id_estate INTEGER NOT NULL REFERENCES estates(id_estate)
        ON DELETE RESTRICT   
        ON UPDATE CASCADE 
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_receipt_number ON memberships(receipt_number);
CREATE INDEX idx_memberships_user_expiration ON memberships(id_user, expiration_date);
CREATE INDEX idx_memberships_last_payment ON memberships(last_payment);