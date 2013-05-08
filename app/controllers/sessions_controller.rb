class SessionsController < ApplicationController
  def new
  end

  def create
   user = User.find_by_email(params[:email].downcase)
   if user && user.authenticate(params[:password])
     session[:user_id] = user.id
     render :json => user, :only => ["id" ,"email"], :status => 200
   else
     render :json => {:msg => "Invalid Login"}, :status => 404
   end
  end

  def destroy
   session[:user_id] = nil
   render :json => {}, :status => :ok
  end
end