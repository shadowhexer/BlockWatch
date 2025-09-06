import java.util.ArrayList;
import java.util.Date;
import java.security.MessageDigest;

// Block class definition
class Block {
    public String hash;
    public String previousHash;
    private String data;
    private long timeStamp;

    public Block(String data, String previousHash) {
        this.data = data;
        this.previousHash = previousHash;
        this.timeStamp = new Date().getTime();
        this.hash = calculateHash();
    }

    public String calculateHash() {
        String input = previousHash + Long.toString(timeStamp) + data;
        return applySha256(input);
    }

    // SHA-256 hashing function
    public static String applySha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes("UTF-8"));
            StringBuffer hexString = new StringBuffer(); 
            for (int i = 0; i < hash.length; i++) {
                String hex = Integer.toHexString(0xff & hash[i]);
                if(hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch(Exception e) {
            throw new RuntimeException(e);
        }
    }
}

// Blockchain runner
public class blockchain {
    public static ArrayList<Block> blockchain = new ArrayList<>();

    public static void main(String[] args) {
        // Genesis block
        blockchain.add(new Block("Genesis Block", "0"));

        // Add more blocks
        blockchain.add(new Block("Crime Report: Stolen bike", blockchain.get(blockchain.size() - 1).hash));
        blockchain.add(new Block("Crime Report: Hit and run", blockchain.get(blockchain.size() - 1).hash));

        // Display the blockchain
        for (int i = 0; i < blockchain.size(); i++) {
            Block block = blockchain.get(i);
            System.out.println("Block " + i);
            System.out.println("Data: " + block.hash);
            System.out.println("Previous: " + block.previousHash);
            System.out.println("Current: " + block.hash);
            System.out.println("--------------");
        }
    }
}
