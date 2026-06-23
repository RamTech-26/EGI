db = db.getSiblingDB('inventario');

db.createUser({
    user: "app-inventario",
    pwd: "password123",
    roles: [{ role: "readWrite", db: "inventario" }]
});

db.hardware.insertMany([
    { _id: "PC-01", fabricante: "Dell", modelo: "OptiPlex 3000", tipo: "desktop", cpu: "i5-12400", ram: "16GB", disco: "512GB SSD", sistemaOperativo: "Windows 11", monitor: "Dell 24''", mouse: "Logitech M90", teclado: "Logitech K120" },
    { _id: "PC-02", fabricante: "HP", modelo: "ProDesk 400", tipo: "desktop", cpu: "i3-10100", ram: "8GB", disco: "256GB SSD", sistemaOperativo: "Windows 10", monitor: "HP 22''", mouse: "HP USB", teclado: "HP USB" },
    { _id: "PC-03", fabricante: "Lenovo", modelo: "ThinkCentre M70", tipo: "desktop", cpu: "i7-10700", ram: "32GB", disco: "1TB HDD", sistemaOperativo: "Ubuntu 22.04", monitor: "LG 27''", mouse: "Logitech M100", teclado: "Logitech K280" },
    { _id: "NB-01", fabricante: "Lenovo", modelo: "ThinkPad E14", tipo: "laptop", cpu: "Ryzen 5 5500U", ram: "8GB", disco: "256GB SSD", sistemaOperativo: "Ubuntu 22.04" },
    { _id: "NB-02", fabricante: "HP", modelo: "ProBook 450", tipo: "laptop", cpu: "i5-1135G7", ram: "16GB", disco: "512GB SSD", sistemaOperativo: "Windows 11" },
    { _id: "NB-03", fabricante: "Asus", modelo: "ExpertBook B1", tipo: "laptop", cpu: "i3-1115G4", ram: "8GB", disco: "256GB SSD", sistemaOperativo: "Windows 10" }
]);