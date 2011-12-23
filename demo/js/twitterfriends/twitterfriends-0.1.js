/*! TwitterFrieds v0.1 | Autor: Jhean Ceballos: @shogoki_vnz 
is released under the MIT License <http://www.opensource.org/licenses/mit-license.php*/
var TwitterFriends = (function() {
	var UsersArray = [];
	var $target;
	var isDataloadComplete = false;
	var isAutoCompleteOpen = false;
	var currentSearchText;
	var MAX_FRIENDS_TO_LOOKUP = 100;
	
	var getUserFriendsIDS = function (user_id){
		if(!isDataloadComplete){			
			var getVars = ($.isNumeric(user_id)) ? 'user_id='+user_id : 'screen_name='+user_id;
			var url = '//api.twitter.com/1/friends/ids.json?cursor=-1&'+getVars;
			$.ajax({
					type: 'GET',			
					url: url,
					dataType: 'jsonp',
					timeout: 8000,					
					error: function(json, textStatus) {	
						hidePreloader();
						console.log("An error occurred when completing the request, please check that the username or id are valid");				
					},
					success: function(json, textStatus) {						
						var friendsIDS = json.ids;
						var totalFriends = friendsIDS.length;					
						getUserNamesOfIDS(friendsIDS);					
					}
			});
		}
	}

	var getUserNamesOfIDS = function (friendsIDS){
		var totalFriends = friendsIDS.length;
		var usersToGet = (totalFriends > MAX_FRIENDS_TO_LOOKUP) ? friendsIDS.splice(0,MAX_FRIENDS_TO_LOOKUP) : friendsIDS.join();
		var url = '//api.twitter.com/1/users/lookup.json?user_id='+usersToGet;
		$.ajax({
				type: 'GET',			
				url: url,
				dataType: 'jsonp',
				success: function(json, textStatus) {
					var totalUserInfo = json.length;
					for(var i = 0; i < totalUserInfo; i++){
						UsersArray.push(
										{
											"name":json[i].screen_name, 
											"avatar":json[i].profile_image_url
										});
					}
					
					if(totalFriends > MAX_FRIENDS_TO_LOOKUP){
						getUserNamesOfIDS(friendsIDS);
					}else{
						createAutocompleteElement(); 
						isDataloadComplete = true;						
					}
				}
		});
	}
	
	var showPreloader = function(){
		var tw = $target.width();
		var position = $target.position();
		var top = position.top;
		var left = (position.left+tw)-16;
		
		var $element = $('<div id="twittUserPloader"></div>')
									.css('top', top)
									.css('left', left);
									
		$target.parent().append($element);		
	}
	
	var hidePreloader = function(){
		$('#twittUserPloader').fadeOut('slow');
	}
	
	var createAutocompleteElement = function(){	
			var $element = $('<div id="twitterUsers"></div>');
										
			var total_friends = UsersArray.length;
			for(var i=0; i < total_friends; i++){
				var name = UsersArray[i].name;
				var avatar = UsersArray[i].avatar;
				$div = $('<div class="info" data-username="@'+name+'"></div>')
								.css('display', 'none')
								.on('click',
										function(){										
											replaceText($(this).attr('data-username'));
										});
										
				$div.append($('<img src="'+avatar+'" width="24px" height="24px"/>'));
				$div.append($('<p>@'+name+'</p>'));
				$element.append($div);
			}
			
			$target.parent().append($element);
			
			$target.on('keydown', function( event ) {
					if(isAutoCompleteOpen){
						if ( event.keyCode == 13 ){
							event.preventDefault();
							replaceText($('.selected').attr('data-username'));
						}else if ( event.keyCode == 9 ){
							event.preventDefault();
							replaceText($('.selected').attr('data-username'));
						}else if ( event.keyCode == 38 || event.keyCode == 37){
							event.preventDefault();
							var $element = $('#twitterUsers').find('.selected').removeClass('selected').prevAll().filter(':visible').first();
							if($element.length == 1)
								$element.addClass('selected');
							else	
								$('.info').filter(':visible').last().addClass('selected');
						}else if ( event.keyCode == 40 || event.keyCode == 39){
							event.preventDefault();
							var $element = $('#twitterUsers').find('.selected').removeClass('selected').nextAll().filter(':visible').first();
							if($element.length == 1)
								$element.addClass('selected');
							else	
								$('.info').filter(':visible').first().addClass('selected');
						}
					}
				})
			
			$target.on('keyup', function(event){							
								if(!isAutoCompleteOpen){
									var patt = /@(?![a-z\-.0-9])/i;
									currentSearchText = "@";
									
									var fieldText = $(this).val();
									var hasMatch = fieldText.match(patt);
									
									if(hasMatch){
										showComponent();
										testString();								
									}
								}else{
									var isString = /[a-z\-.]/i;
									if(isString.test(String.fromCharCode(event.keyCode))){
										var character =  String.fromCharCode(event.keyCode);								
										currentSearchText = currentSearchText.concat(character);
										testString();
									}else if(event.keyCode==32){
										hideComponent();									
									}else if(event.keyCode==8){
										if(currentSearchText.length == 1){										
											hideComponent();
										}else{
											currentSearchText = currentSearchText.substr(0, currentSearchText.length-1);
											testString();
										}
									}
								}
							});
							
			hidePreloader();
	}
	
	var replaceText = function(textToReplace){
		if(textToReplace != undefined){
			var patt= (currentSearchText.length > 1) ? new RegExp(currentSearchText,'i') : /@(?![a-z\-.0-9])/i;
			var newText = $target.val().replace(patt, textToReplace);
			$target.val(newText);
		}
		$target.get(0).focus();
		setCursorPosition(newText.length);
		hideComponent();
	}
	
	var showComponent = function(){
		if(!isAutoCompleteOpen){
			var tw = ($target.width() > 200) ? $target.width() : 200;
			var th = $target.height();	
			var h = 150;
			var position = $target.position();		
			var top = (position.top > h) ? position.top-h : position.top + th;
			var left = position.left;
			$('#twitterUsers').css('width', tw)
									.css('height', h)
									.css('top', top)
									.css('left', left);
			
			$('#twitterUsers').fadeIn(500);
			isAutoCompleteOpen = true;
		}
	}
	
	var hideComponent = function(){
		if(isAutoCompleteOpen){
			$('#twitterUsers').fadeOut(300);
			isAutoCompleteOpen = false;
			$('.info').css("display", "none");
			currentSearchText = '';
		}
	}
	
	var testString = function(){
		$('.info').css("display", "none").removeClass('selected').filter(function(index) {
		  var patt= new RegExp(currentSearchText,'i');
		  return patt.test($(this).attr('data-username'));
		}).css("display", "block");
		
		$('.info').filter(':visible').first().addClass('selected');
	}
	
	var setCursorPosition = function(pos) {
		if ($target.get(0).setSelectionRange) {
		  $target.get(0).setSelectionRange(pos, pos);
		} else if ($target.get(0).createTextRange) {
		  var range = $target.get(0).createTextRange();
		  range.collapse(true);
		  range.moveEnd('character', pos);
		  range.moveStart('character', pos);
		  range.select();
		}
	  }
	
	return {
		Init : function(user_id, $_target){
			$target = $_target
			if($target.is(':visible')){
				showPreloader();
			}
			getUserFriendsIDS(user_id);
		}		
	};

})();