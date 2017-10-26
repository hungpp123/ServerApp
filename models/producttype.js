var mongoose = require('mongoose');

var ProductTypeSchema = new mongoose.Schema({
	_id:Number,
  name:String,
  images:String,
});

var ProductType = mongoose.model('ProductType', ProductTypeSchema);
module.exports = ProductType;

