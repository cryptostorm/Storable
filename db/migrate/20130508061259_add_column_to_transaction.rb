class AddColumnToTransaction < ActiveRecord::Migration
  def change
    add_column :transactions, :price, :integer
  end
end
