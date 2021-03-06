var i = 0;
App.Views.Conversations = Backbone.View.extend({

	model: App.User,
	collection: App.Collections.Conversations,
	showing : false,

	el: $("#conversations-container"),

	events : {
		"click #toggle-all-messages" : "all_messages",
		"click #toggle-hosting-messages" : "hosting_messages",
		"click #toggle-renting-messages" : "renting_messages",
		"click #toggle-starred-messages" : "starred_messages",
		"click #toggle-unread-messages" : "unread_messages",
	},

	initialize: function() {
		if ($("#conversation-template").size()!=0){
			this.template = _.template($("#conversation-template").html());
		}
		this.collection = new App.Collections.Conversations({});
		this.conversations = this.$("#conversations");
		that = this;
		this.toggle_all = this.$("#toggle-all-messages");
		this.toggle_host = this.$("#toggle-hosting-messages");
		this.toggle_renting = this.$("#toggle-renting-messages");
		this.toggle_unread = this.$("#toggle-unread-messages");
		this.toggle_starred = this.$("#toggle-starred-messages");
		this.tabs = [ this.toggle_all, this.toggle_starred, this.toggle_unread, 
					  this.toggle_host, this.toggle_renting ];
		this.new_message_template = _.template($("#new-message-template").html());
		this.new_messages = $("#new-messages");
		setInterval(function(){
			that.fetch();
		}, 5000);
		that.fetch();
	},
	
	fetch : function(){
		if (App.User.get("loggedIn")) {
			that = this;
			that.collection.fetch({
				success: function(data, response, options){
					that.render();
					data.models.filter(function(message){
						var bool = (Date.now()-(new Date(message.get("updated_at"))).getTime() < 1000*6) && 
						 message.get("last_id") != App.User.get("id") && (message.showed == null ||
						  message.showed != message.get("updated_at"));
						 message.showed = message.get("updated_at");
						 return bool;

					}).forEach(function(message){
						that.new_messages.append(that.new_message_template(message.attributes));
						var el = $(".new-message").last()
						el.hide().show("slide", { direction: "down" }, 1000);
						setTimeout(function(){
							el.hide("slide", { direction: "down" }, 1000)
						}, 5000)
					});
					if(!that.showing){
						that.all_messages();
					}

				},
				error: function(model, response, options){
					console.log(response);
				}
			});
		}
	},

	toggleIconClasses : function(bool, icon){
 	 	if (icon.hasClass("icon-star-empty")){
		 	icon.removeClass("icon-star-empty");
		 	icon.addClass("icon-star");
	    } else {
		 	icon.removeClass("icon-star");
		 	icon.addClass("icon-star-empty");
		}
	 	if(bool){
	 		var id = icon.parent().parent().parent()[0].id
	 		if(icon.hasClass("empty")){
		 		icon.removeClass("empty");
		 		this.collection.filter(function(model){
		 			return model.get("id") == id;
		 		}).forEach(function(model){
		 			model.set({"starred" : true });
		 		});
			 	$.ajax({
			 		type: "PUT",
			 		url: '/conversations' +'/'+id,
			 		data: {
			 			star : true
			 		}
			 	});
		 	} else {
		 		icon.addClass("empty");
		 		this.collection.filter(function(model){
		 			return model.get("id") == id;
		 		}).forEach(function(model){
		 			model.set({"starred" : false });
		 		});
		 		$.ajax({
			 		type: "PUT",
			 		url: '/conversations' +'/'+id,
			 		data: {
			 			star : false
			 		}
			 	});
		 	}
		 }
	},

	render : function(){
		if ($("#conversation-template").size()!=0){
			this.conversations.html('');
			that = this;
			_.each(this.showing, function(conversation) {	
				self = that;
				this.$(conversations).append(that.template(conversation.attributes));
				$(".star-icon").last().click(function(){
				 	self.toggleIconClasses(true, $(this));
				}).mouseover(function(){
				 	self.toggleIconClasses(false, $(this));
				}).mouseleave(function(){
				 	self.toggleIconClasses(false, $(this));
				});
			});
		}
	},

	clean : function(){
        _.each(this.tabs, function(d){ 
        	d.removeClass("active");
        });
	},

	all_messages : function(){
		this.clean();
		this.active = this.toggle_all;
		this.toggle_all.addClass("active");
		this.showing = this.collection.all_messages();
		this.render();
	},

	hosting_messages : function(){
		this.clean();
		this.active = this.toggle_host;
		this.toggle_host.addClass("active");
		this.showing = this.collection.hosting_messages();
		this.render();
	},

	renting_messages : function(){
		this.clean();
		this.active = this.toggle_renting;
		this.toggle_renting.addClass("active");
		this.showing = this.collection.renting_messages();
		this.render();
	},

	starred_messages : function(){
		this.clean();
		this.active = this.toggle_starred;
		this.toggle_starred.addClass("active");
		this.showing = this.collection.starred_messages();
		this.render();
	},

	unread_messages : function(){
		this.clean();
		this.active = this.toggle_unread;
		this.toggle_unread.addClass("active");
		this.showing = this.collection.unread_messages();
		this.render();
	},

});