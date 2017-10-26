var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var BillSchema = new mongoose.Schema({
  id_customer:ObjectId,
  date_order: Date,
  total:Number,
  note: String,
  status: Number,
  bill_detail:[{id_product: Number, quantity: Number, price:Number}]
});

var Bill = mongoose.model('Bill', BillSchema);
module.exports = Bill;
