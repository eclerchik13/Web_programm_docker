'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TestResult extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  TestResult.init({
    userId: DataTypes.INTEGER,
    testId: DataTypes.INTEGER,
    testTitle: DataTypes.STRING,
    grade: DataTypes.INTEGER,
    attempt: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'TestResult',
  });
  return TestResult;
};