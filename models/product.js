var mongoose = require('mongoose');

var ProductSchema = new mongoose.Schema({
  _id:Number,
  name:String,
  id_type:Number,
  price:Number,
  color:String,
  description:String,
  new:Number,
  inCollection:Number,
  images:Array
});

var Product = mongoose.model('Product', ProductSchema);
module.exports = Product;

