class Listing < ActiveRecord::Base
	attr_accessible :title, :description, :price, :size, :start_date, :end_date 

    belongs_to :user
    has_one :location
    has_many :conversations
	has_many :images, :as => :imageable

    has_many :reserved_dates

    has_many :transaction_reviews, :foreign_key => :listing_id

    def as_json(options={})
      super(:include =>[:images, :location, :reserved_dates])
    end

    def create_reserved_date(transaction, listing)
	  reserved_date = listing.reserved_dates.build(
	  	:listing_id => listing.id,
	  	:renter_id  => transaction.renter_id,
	  	:start_date => transaction.start_date,
	  	:end_date   => transaction.end_date
      )
      reserved_date.save()
    end


    #This method searches through all the listings based on the filters that are passed in
    def self.search(search_params)

        #get the address and radius --> THESE ARE REQUIRED
        address = search_params[:address]
        radius = search_params[:radius]

        #first filter by locations within radius miles of the given address
        locations = Location.near(address, radius)

        #if start date is passed in as a paramter then filter by that as well
        if search_params.has_key?(:start_date)

           #get the start date
           start_date = Date.parse(search_params[:start_date])

           #find all locations that have a start date earlier than the one passed in
           locations = locations.joins(:listing).where('listings.start_date <= ?', start_date)

           #find all listings that have reservations which conflict with the start date given
           #these constitute one of the exclusion sets
           exclusions_start = Listing.joins(:reserved_dates).where('(reserved_dates.start_date <= ? AND reserved_dates.end_date >= ?)',start_date,start_date)
        end

        #if end date is passed in as a paramter then filter by that as well
        if search_params.has_key?(:end_date)

           #get the end date
           end_date = Date.parse(search_params[:end_date])

           #find all locations that have a end date later than the one passed in
           locations = locations.joins(:listing).where('listings.end_date >= ?', end_date)

           #find all listings that have reservations which conflict with the end date given
           #these constitute the second of the exclusion sets
           exclusions_end = Listing.joins(:reserved_dates).where('(reserved_dates.start_date <= ? AND reserved_dates.end_date >= ?)',end_date,end_date)

        end

        #if space is passed in as a parameter, then further filter the locations 
        if search_params.has_key?(:space)
          locations = locations.joins(:listing).where('listings.size > ?', search_params[:space])
        end

        #collect all the listing ids
        listing_ids = locations.collect(&:listing_id) 

        #exclude all listings that conflict in terms of reserved dates
        if defined?(exclusions_start) && !exclusions_start.nil?
          listing_ids = listing_ids - exclusions_start.collect(&:id)
        end

        if defined?(exclusions_end) && !exclusions_end.nil?
          listing_ids = listing_ids - exclusions_end.collect(&:id)
        end

        #find all the listing objects and return them
        listings = []
        listing_ids.each do |listing_id|
            listings.push(Listing.find(listing_id))
        end

        return listings.compact
    end

end