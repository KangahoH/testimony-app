const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});

const Testimony = sequelize.define('Testimony', {
  name: DataTypes.STRING,
  date: DataTypes.DATEONLY,
  phone: DataTypes.STRING,
  nextOfKin: DataTypes.STRING,
  nextOfKinContact: DataTypes.STRING,
  area: DataTypes.STRING,
  problem: DataTypes.TEXT,
  duration: DataTypes.STRING,
  currentState: DataTypes.STRING,
  healingMode: DataTypes.TEXT,
  officialName: DataTypes.STRING,
  officialNumber: DataTypes.STRING,
  transcript: DataTypes.TEXT,
  audioFile: DataTypes.STRING,
});

module.exports = { sequelize, Testimony };
