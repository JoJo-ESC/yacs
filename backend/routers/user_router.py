from fastapi import APIRouter, Request, status
  from fastapi.responses import JSONResponse                                     
                                                      
  from schemas.api_models import PreferredSemesterPydantic, UserPydantic            
  from schemas.user_schemas import UserProfileResponse, UserProfileUpdate           
  from services import user_service                                                 
                                                                                    
  router = APIRouter(prefix="/api", tags=["Users"])                                 
                                                                                    
                                                                                    
  @router.post('/user')
  async def add_user(user: UserPydantic):                                           
      """Create a new user account."""
      result = user_service.create_user(user.dict())
      if result.get("success"):                                                     
          return JSONResponse(status_code=status.HTTP_201_CREATED, content=result)
      return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=result)  
                                                                                    
  
  @router.delete('/user')                                                           
  async def delete_user(request: Request):
      """Delete the currently logged-in user."""
      if 'user' not in request.session:
          return JSONResponse(status_code=status.HTTP_403_FORBIDDEN,
  content={"success": False, "message": "Not authorized."})                         
      user_id = request.session['user']['user_id']
      result = user_service.delete_current_user(user_id)                            
      if result.get("success"):                                                     
          return JSONResponse(status_code=status.HTTP_200_OK, content=result)
      return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=result)  
                                                                                    
  
  @router.put('/user/preferred-semester')                                           
  async def set_preferred_semester(request: Request, payload:
  PreferredSemesterPydantic):
      """Update preferred semester for the current user."""
      if 'user' not in request.session:                                             
          return JSONResponse(status_code=status.HTTP_403_FORBIDDEN,
  content={"success": False, "message": "Not authorized."})                         
      user_id = request.session['user']['user_id']
      result = user_service.update_preferred_semester(user_id,                      
  payload.preferred_semester)
      if result.get("success"):                                                     
          return JSONResponse(status_code=status.HTTP_200_OK, content=result)
      return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content=result)  
  
                                                                                    
  @router.get("/profile", response_model=UserProfileResponse)
  async def get_profile(request: Request):
      if 'user' not in request.session:                                             
          return JSONResponse(status_code=status.HTTP_403_FORBIDDEN,
  content={"success": False, "message": "Not authorized."})                         
      user_id = request.session['user']['user_id']
      return user_service.get_user_profile(user_id)                                 
  
                                                                                    
  @router.patch("/profile", response_model=UserProfileResponse)
  async def update_profile(request: Request, profile_data: UserProfileUpdate):
      if 'user' not in request.session:                                             
          return JSONResponse(status_code=status.HTTP_403_FORBIDDEN,
  content={"success": False, "message": "Not authorized."})                         
      user_id = request.session['user']['user_id']
      return user_service.update_user_profile(user_id,                              
  profile_data.dict(exclude_unset=True))