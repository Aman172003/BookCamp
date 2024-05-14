USE bookcamp

CREATE TABLE User (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE Campground (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    geometry_type ENUM('Point') NOT NULL,
    coordinates_x DECIMAL(10, 6) NOT NULL,
    coordinates_y DECIMAL(10, 6) NOT NULL,
    price DECIMAL(10, 2),
    description TEXT,
    location VARCHAR(255),
    author_id INT,
    FOREIGN KEY (author_id) REFERENCES User(id)
);

CREATE TABLE Image (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campground_id INT,
    url VARCHAR(255),
    filename VARCHAR(255),
    FOREIGN KEY (campground_id) REFERENCES Campground(id)
);



CREATE TABLE Review (
    id INT PRIMARY KEY AUTO_INCREMENT,
    body TEXT,
    rating INT,
    author_id INT,
    campground_id INT,
    FOREIGN KEY (author_id) REFERENCES User(id),
    FOREIGN KEY (campground_id) REFERENCES Campground(id)
);



