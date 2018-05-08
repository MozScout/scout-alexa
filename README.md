# scout-alexa

This is a lambda function that drives the Alexa skill for Scout.  

### Cross Compiling the natural packages
In order to run this on Amazon, some of the node packages need to be cross-compiled on Amazon linux to work properly.  Here is a set of steps to do this:
* Create an EC2 instance of Amazon Linux.  [Create an EC2 instance of Amazon Linus](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html)
* Be sure to choose Amazon Linux when you choose your instance type.
* SSH to your instance
  * ssh -i /path/to/key/yourkey.pem ec2-user@amazon-instance.hostname.com
* Install node |curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash|
* Set the node version to match your lambda version: |nvm install 8.10|
* Install dev tools:  |sudo yum groupinstall "Development Tools"|
* Install git: |sudo yum install git|
* clone the source: |git clone https://github.com/MozScout/scout-alexa.git|
* |cd scout-alexa && npm install|
* copy the scout-alexa/node_modules directory to your local machine from the directory where your key is:  |scp -i ./yourkey.pem -r ec2-user@yourhost.compute-1.amazonaws.com:/home/ec2-user/scout-alexa/ /your/local/dest/|
* Use that node_modules directory when uploading your lambda function making sure to use the same version that ou cross compiled on.
