from pydantic import BaseModel
from typing import List, Union

class directory_callback_link(BaseModel):
    _id: str
    url: str
    content_type: List[str]
    index: Union[str, int]
    leak_status_date: int
    network_type: str
    url_status_date: int

class directory_callback_model(BaseModel):
    page: int
    mNetwork: str
    mTotalPage: int
    mStartPage: int
    mEndPage: int
    mPagination: List[int]
    mUseSecureServiceNotice: str
    mDirectoryCallbackLinks: List[directory_callback_link]
    mDirectoryCallbackPageNumberMaxReached: bool
    mContentType: str
    mIndex: str
