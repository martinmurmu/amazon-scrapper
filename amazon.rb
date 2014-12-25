#############################################################################################################
####
####
####   THERE SHOULD BE NO NEED TO MODIFY ANYTHING HERE UNLESS AMAZON CHANGES THEIR PAGES MUCH
####
####

#require 'nokogiri'
#require 'openssl'
##require 'base64'
#require 'time'

#require './config'
#require './utils'

#require 'pp'

# the different amazon sites we care about
DOMAINS = %w(com ca co.uk)

CATEGORIES = {
  'com'   => '<option value="search-alias=aps" selected="selected">All Departments</option><option value="search-alias=instant-video">Amazon Instant Video</option><option value="search-alias=appliances">Appliances</option><option value="search-alias=mobile-apps">Apps for Android</option><option value="search-alias=arts-crafts">Arts, Crafts &amp; Sewing</option><option value="search-alias=automotive">Automotive</option><option value="search-alias=baby-products">Baby</option><option value="search-alias=beauty">Beauty</option><option value="search-alias=stripbooks">Books</option><option value="search-alias=mobile">Cell Phones &amp; Accessories</option><option value="search-alias=apparel">Clothing &amp; Accessories</option><option value="search-alias=collectibles">Collectibles</option><option value="search-alias=computers">Computers</option><option value="search-alias=financial">Credit Cards</option><option value="search-alias=electronics">Electronics</option><option value="search-alias=gift-cards">Gift Cards Store</option><option value="search-alias=grocery">Grocery &amp; Gourmet Food</option><option value="search-alias=hpc">Health &amp; Personal Care</option><option value="search-alias=garden">Home &amp; Kitchen</option><option value="search-alias=industrial">Industrial &amp; Scientific</option><option value="search-alias=jewelry">Jewelry</option><option value="search-alias=digital-text">Kindle Store</option><option value="search-alias=magazines">Magazine Subscriptions</option><option value="search-alias=movies-tv">Movies &amp; TV</option><option value="search-alias=digital-music">MP3 Music</option><option value="search-alias=popular">Music</option><option value="search-alias=mi">Musical Instruments</option><option value="search-alias=office-products">Office Products</option><option value="search-alias=lawngarden">Patio, Lawn &amp; Garden</option><option value="search-alias=pets">Pet Supplies</option><option value="search-alias=shoes">Shoes</option><option value="search-alias=software">Software</option><option value="search-alias=sporting">Sports &amp; Outdoors</option><option value="search-alias=tools">Tools &amp; Home Improvement</option><option value="search-alias=toys-and-games">Toys &amp; Games</option><option value="search-alias=videogames">Video Games</option><option value="search-alias=watches">Watches</option>',
  'ca'    => '<option value="search-alias=aps" selected="selected">All Departments</option><option value="search-alias=baby">Baby</option><option value="search-alias=stripbooks">Books</option><option value="search-alias=classical">Classical</option><option value="search-alias=electronics">Electronics</option><option value="search-alias=kitchen">Home &amp; Kitchen</option><option value="search-alias=digital-text">Kindle Store</option><option value="search-alias=dvd">Movies &amp; TV</option><option value="search-alias=popular">Music</option><option value="search-alias=software">Software</option><option value="search-alias=sporting">Sports &amp; Outdoors</option><option value="search-alias=tools">Tools &amp; Building Supplies</option><option value="search-alias=vhs">VHS</option><option value="search-alias=videogames">Video Games</option><option value="search-alias=watches">Watches</option>',
  'co.uk' => '<option value="search-alias=aps" selected="selected">All Departments</option><option value="search-alias=baby">Baby</option><option value="search-alias=beauty">Beauty</option><option value="search-alias=stripbooks">Books</option><option value="search-alias=automotive">Car &amp; Motorbike</option><option value="search-alias=classical">Classical</option><option value="search-alias=clothing">Clothing</option><option value="search-alias=computers">Computers &amp; Accessories</option><option value="search-alias=diy">DIY &amp; Tools</option><option value="search-alias=electronics">Electronics &amp; Photo</option><option value="search-alias=dvd">Film &amp; TV</option><option value="search-alias=outdoor">Garden &amp; Outdoors</option><option value="search-alias=grocery">Grocery</option><option value="search-alias=drugstore">Health &amp; Beauty</option><option value="search-alias=jewelry">Jewellery</option><option value="search-alias=digital-text">Kindle Store</option><option value="search-alias=kitchen">Kitchen &amp; Home</option><option value="search-alias=appliances">Large Appliances</option><option value="search-alias=lighting">Lighting</option><option value="search-alias=digital-music">MP3 Music</option><option value="search-alias=popular">Music</option><option value="search-alias=mi">Musical Instruments &amp; DJ</option><option value="search-alias=videogames">PC &amp; Video Games</option><option value="search-alias=pets">Pet Supplies</option><option value="search-alias=shoes">Shoes &amp; Accessories</option><option value="search-alias=software">Software</option><option value="search-alias=sports">Sports &amp; Outdoors</option><option value="search-alias=office-products">Stationery &amp; Office Supplies</option><option value="search-alias=toys">Toys &amp; Games</option><option value="search-alias=vhs">VHS</option><option value="search-alias=watches">Watches</option>'
}

# this module handles everything Amazon related
module Amazon

# the signing procedure is from http://docs.aws.amazon.com/AWSECommerceService/2011-08-01/DG/rest-signature.html
def self.request(domain,*params)

  params = params[0].clone

  params['Timestamp']      = Time.now.utc.iso8601
  params['AWSAccessKeyId'] = AMAZON[domain][:accesskey]

  params.each_pair do |key,value|
    params[key] = URI.escape(value.to_s).gsub(',','%2C').gsub(':','%3A')
  end

  query = params.map{|k,v|"#{k}=#{v}"}.sort.join('&')

  host = 'webservices.amazon.' + domain
  path = '/onca/xml'

  secret = AMAZON[domain][:secret]
  data   = "GET\n#{host}\n#{path}\n#{query}"
  sig    = URI.encode(Base64.encode64(OpenSSL::HMAC.digest(OpenSSL::Digest::Digest.new('sha256'), secret, data)).strip()).gsub('+','%2B').gsub('=','%3D').gsub('/','%2F')

  url = "http://#{host}#{path}?#{query}&Signature=#{sig}"
end


# BrowseNodeInfo -- returns child nodes -> drill down

RESPONSEGROUPS = 'Medium,Reviews'

#MAPPING = {
#  'TotalReviews' # number of reviews
#}





# the different amazon sites we know about
SITES = %w(com ca co.uk)

# where to find information on the page
SELECTORS = {
  :sortby      => '#sortBy',
  :refinements => '#refinements',
  :breadcrumbs => '#breadCrumb',
  :nextpage   => 'a[title="Next Page"] @href',
  :results     => "*[id^='result_']"
}



#############################################################################
#
#  the products on the current page
#
#  it takes a Nokogiri::HTML object for the whole page
#
#  it returns an array with hashes of the product details
#

FIELDS = {
  :asin     => '@name',
  :link     => '.image a @href',
  :image    => '.productImage @src',

  # title for other stuff
  :title    => '.newaps a .bold text()',
  :brand    => '.newaps .med.reg a text()',

  # possible category in search results
  :category => '.bold.orng text()',

  # prices
  :sale_price => '.newp .bld.red text()',
  :list_price => '.newp .grey text()', # might be missing

  # more prices
  :sale_price_m => '.newPrice span.price.addon text()',
  :list_price_m => '.newPrice strike.addon text()',

  # more prices
  :sale_price_n => '.mkp2 .price.bld text()',


  # music has it different
  :title_m  => '.title a.title text()',
  :brand_m  => '.ptBrand a text()',
  :release  => '.bindingAndRelease text()', # remove the quotes and keep the year
  :formats  => '.tp tr:not([class="toeHeader"])',

  # another format for brand and release
  :brand_release_x => '.newaps .med.reg text()',

  # bestseller number
  :rank     => '.rankNumber text()',

  # these are in random places, but can be easily identified
  :rating   => "*[alt$=' out of 5 stars'] @alt", # remove the ' out of ...' part
  :reviews  => "a[href*='/product-reviews/'] > text()", # needs whitespace stripping

  :reviews_m => ".rvwCnt a text()",
  :reviews_n => ".reviewsCount a text()"
}

FORMATFIELDS = {
  :format     => '.toeLinkText text()',
  :sale_price => '.toeOurPrice a text()',
  :list_price => '.toeListPrice a text()' # &nbsp; should be deleted
}



def self.simple_p(s,z)

  # copy everything as text by default
  p = s.clone

  # add the affiliate id
  #p[:link] = z[:link][0].to_s + ($affiliate && $affiliate != '' ? '&tag=' + $affiliate : '')

  # fix brand and title if it was put on the other position instead
  p[:title] = s[:title_m] if p[:title] == ''
  p[:brand] = s[:brand_m] if p[:brand] == ''

  # fix random small things
  p[:rating]  = '%0.1f' % (s[:rating].gsub(/ out of.*/,'').to_f) unless p[:rating] == ''
  p[:reviews] = s[:reviews].to_s unless p[:reviews] == ''
  p[:release] = s[:release].gsub(/.*\((.*)\).*/,'\1')
  p[:category] = s[:category].gsub(/:$/,'')

  # get brand or release another way if missing
  if p[:brand_release_x] != ''
    p[:brand]   = p[:brand_release_x].gsub(/.*by\s+/,'').gsub(/\s*\(.*/,'')            if p[:brand]   == ''
    p[:release] = ((match = /\(([^)]+)\)/.match(p[:brand_release_x])) ? match[1] : '') if p[:release] == ''
  end

  p[:sale_price] = p[:sale_price_m] if p[:sale_price] == ''
  p[:sale_price] = p[:sale_price_n] if p[:sale_price] == ''
  p[:list_price] = p[:list_price_m] if p[:list_price] == ''
  p[:reviews]    = p[:reviews_m]    if p[:reviews]    == ''
  p[:reviews]    = p[:reviews_n]    if p[:reviews]    == ''

  p[:reviews] = p[:reviews].to_s.gsub(',','').gsub(/ cust.*/,'')

  p[:reviews] = p[:reviews].to_i
  # get rid of extraneous fields
  %w(formats title_m brand_m brand_release_x sale_price_m sale_price_n list_price_m reviews_m reviews_n).each{|k|p.delete(k.to_sym)}

  return p
end


# add computed fields
def self.extra_p(p)
  if p[:sale_price]['-'] || p[:list_price]['-']
    p[:discount] = p[:percent] = p[:commission] = ''
  else

    sp = p[:sale_price].gsub(/[^0-9.]/,'').to_f
    lp = p[:list_price].gsub(/[^0-9.]/,'').to_f

    un = p[:sale_price].gsub(/[0-9.,]/,'') # unit
  
    discount = ''
    percent = ''
  
    if lp != 0.0
      discount = '%s%.2f' % [un, (lp - sp).round(2)]
      percent = '%.1f%%' % ((1-sp/lp)*100).round(2)
    end

    p[:discount] = discount
    p[:percent]  = percent

    c = (sp * 0.04).round(2)
    p[:commission] = (c >= 0.014 ? '%s%.2f' % [un, c] : '')
  end

  p[:rank] = 'Yes' if p[:rank] != ''

  p
end

require 'pp'
def self.products(x)

  # this is where the results will be stored
  r = []

  # iterate through the results and add them to the results array (r)
  v = x.search(SELECTORS[:results])

  v.each do |x|

    # let's mine the keys we need from the result blocks
    z = {}; s = {}
    FIELDS.each_pair do |key,pattern|
      s[key] = (z[key] = x.search(pattern))[0].to_s.gsub(/&amp;/,'&').gsub(/^\s+|\s+$/m,'')
      pp z[key] if key == :category
    end

    # if there are multiple formats, make a line for each
    if z[:formats].length > 0
      z[:formats].each do |format|
        p = simple_p(s,z)

        v = {}; t = {}
        FORMATFIELDS.each_pair do |key,pattern|
          t[key] = (v[key] = format.search(pattern)).to_s.gsub(/&amp;/,'&').gsub(/^\s+|\s+$/m,'')
        end

        p[:list_price] = t[:list_price].strip
        p[:sale_price] = t[:sale_price].strip
        
        p[:format] = t[:format]
        
        r << extra_p(p) if p[:sale_price] != ''
      end
    else
      p = simple_p(s,z)

      p[:format] = ''

      r << extra_p(p) if p[:sale_price] != ''
    end
  end

  return r
end


def self.refinements(x)
  x.search(SELECTORS[:refinements])
end

def self.sortby(x)
  s = x.search(SELECTORS[:sortby])
  s.search('*[onchange]').each{|n|n.delete('onchange')}
  s
end

def self.breadcrumbs(x)
  s = x.search(SELECTORS[:breadcrumbs])
  s.search('#bcSpan').remove
  s.search('noscript').remove
  s
end

def self.nextpage(x)
  s = x.search(SELECTORS[:nextpage]).to_s
  s
end

end # module
